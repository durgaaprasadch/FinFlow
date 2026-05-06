package com.finflow.application.service;

import com.finflow.application.dto.CreateApplicationRequest;
import com.finflow.application.dto.EmploymentDetailsRequest;
import com.finflow.application.dto.LoanDetailsRequest;
import com.finflow.application.dto.PersonalDetailsRequest;
import com.finflow.application.entity.*;
import com.finflow.application.exception.*;
import com.finflow.application.messaging.ApplicationEventPublisher;
import com.finflow.application.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.time.*;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class LoanApplicationService {

    private static final String UNAUTHORIZED_MSG = "Unauthorized: Only ADMIN can set status to ";
    private static final Set<String> DEFAULT_REQUIRED_DOCUMENT_TYPES = Set.of(
            "AADHAAR", "PAN", "SALARY_SLIP", "BANK_STATEMENT", "PHOTO");
    private static final String ROLE_ADMIN_LITERAL = "ADMIN";
    private static final String HEADER_USER_ROLE = "userRole";
    private static final Set<String> ALLOWED_EMPLOYMENT_TYPES = Set.of(
            "SALARIED", "SELF_EMPLOYED", "BUSINESS", "FREELANCER");
    
    private final LoanApplicationRepository repository;
    private final LoanStatusHistoryRepository historyRepository;
    private final DocumentRequirementRepository requirementRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final RestTemplate restTemplate;

    private static final String DOCUMENT_SERVICE_URL = "http://document-service/api/documents";

    public LoanApplication createDraft(LoanApplication app) {
        app.setStatus(LoanStatus.DRAFT);
        return repository.save(app);
    }

    @org.springframework.transaction.annotation.Transactional
    public LoanApplication createApplicantDraft(CreateApplicationRequest request, String applicantId,
            String applicantUsername) {
        if (request == null) {
            throw new ApplicationException("Application request is required");
        }
        if (applicantId == null || applicantId.isBlank()) {
            throw new ApplicationException("Applicant ID not found in security context");
        }
        if (applicantUsername == null || applicantUsername.isBlank()) {
            throw new ApplicationException("Applicant username not found in security context");
        }

        java.util.Optional<LoanApplication> activeApp = findActiveApplicationByApplicant(applicantId,
                applicantUsername);
        if (activeApp.isPresent()) {
            LoanApplication existing = activeApp.get();
            LoanStatus status = existing.getStatus();

            if (status != LoanStatus.DRAFT &&
                    status != LoanStatus.APPROVED &&
                    status != LoanStatus.REJECTED &&
                    status.ordinal() >= LoanStatus.SUBMITTED.ordinal()) {
                throw new ApplicationException(
                        "You already have an active application in progress.");
            }

            if (status == LoanStatus.DRAFT || status.ordinal() < LoanStatus.SUBMITTED.ordinal()) {
                existing.setAmount(request.getRequestedAmount());
                existing.setLoanAmount(request.getRequestedAmount());
                if (request.getTenureMonths() != null)
                    existing.setTenure(request.getTenureMonths());
                if (request.getPurpose() != null)
                    existing.setPurpose(normalizeUpper(request.getPurpose()));
                if (request.getLoanType() != null)
                    existing.setLoanType(request.getLoanType().name());

                return repository.save(existing);
            }
        }

        LoanApplication app = new LoanApplication();
        app.setApplicantId(applicantId);
        app.setApplicantUsername(applicantUsername);

        if (request.getLoanType() != null) {
            app.setLoanType(request.getLoanType().name());
        } else if (request.getPurpose() != null) {
            app.setLoanType(normalizeUpper(request.getPurpose()) + "_LOAN");
        }

        app.setAmount(request.getRequestedAmount());
        app.setLoanAmount(request.getRequestedAmount());
        app.setTenure(request.getTenureMonths());
        app.setPurpose(normalizeUpper(request.getPurpose()));

        app.setStatus(LoanStatus.DRAFT);
        return repository.save(app);
    }

    @Transactional
    public void deleteDraftByApplicant(String applicantId, String applicantUsername) {
        LoanApplication app = findActiveApplicationByApplicant(applicantId, applicantUsername)
                .orElseThrow(() -> new ApplicationException("No active application found to delete"));
        deleteApplication(app, applicantUsername);
    }

    @Transactional
    public void deleteApplicationById(Long id, String applicantId, String applicantUsername) {
        LoanApplication app = repository.findById(id)
                .orElseThrow(() -> new ApplicationException("Application not found with ID: " + id));

        if (!applicantId.equals(app.getApplicantId()) && !applicantUsername.equals(app.getApplicantUsername())) {
            throw new ApplicationException("Unauthorized: You do not own this application.");
        }

        deleteApplication(app, applicantUsername);
    }

    private void deleteApplication(LoanApplication app, String username) {
        Long applicationId = app.getId();
        historyRepository.deleteByApplicationId(applicationId);
        repository.delete(app);
        log.info("USER_ACTION: Applicant {} deleted application {}", username, applicationId);
    }

    public LoanApplication getApplicationById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
    }

    public List<LoanApplication> getApplicationsByUser(String username) {
        return repository.findByApplicantUsernameOrderByCreatedAtDesc(username);
    }

    public List<LoanApplication> getApplicationsByApplicant(String applicantId, String username) {
        if (applicantId != null && !applicantId.isBlank()) {
            return repository.findByApplicantIdOrderByCreatedAtDesc(applicantId);
        }
        return repository.findByApplicantUsernameOrderByCreatedAtDesc(username);
    }

    public List<LoanApplication> getAllApplications() {
        return repository.findAll();
    }

    public java.util.Optional<LoanApplication> findActiveApplicationByApplicant(String applicantId,
            String applicantUsername) {
        List<LoanApplication> apps = new ArrayList<>();

        String cleanUsername = applicantUsername != null ? applicantUsername.trim() : null;
        String cleanId = applicantId != null ? applicantId.trim() : null;

        if (cleanUsername != null && !cleanUsername.isBlank()) {
            apps = repository.findByApplicantUsernameOrderByCreatedAtDesc(cleanUsername);
        }

        List<LoanApplication> activeApps = apps;
        if (activeApps.isEmpty() && cleanId != null && !cleanId.isBlank()) {
            activeApps = repository.findByApplicantIdOrderByCreatedAtDesc(cleanId);
        }

        if (activeApps.isEmpty()) {
            return java.util.Optional.empty();
        }

        final List<LoanApplication> finalApps = activeApps;
        return finalApps.stream()
                .filter(app -> app.getStatus() != LoanStatus.APPROVED && app.getStatus() != LoanStatus.REJECTED)
                .findFirst()
                .or(() -> java.util.Optional.of(finalApps.get(0)));
    }

    public LoanApplication updatePersonalDetails(String applicantId, String applicantUsername,
            PersonalDetailsRequest request) {
        LoanApplication app = findActiveApplicationByApplicant(applicantId, applicantUsername)
                .orElseThrow(() -> new ApplicationException("No active application found"));

        checkModifiable(app);

        LoanStatus previousStatus = app.getStatus();
        app.setFullName(request.getFullName());
        app.setDob(request.getDob());
        app.setGender(normalizeUpper(request.getGender()));
        app.setMaritalStatus(normalizeUpper(request.getMaritalStatus()));
        app.setPanNumber(request.getPanNumber());
        app.setAadhaarNumber(request.getAadhaarNumber());
        app.setAddressLine1(request.getAddress().getLine1());
        app.setCity(request.getAddress().getCity());
        app.setState(request.getAddress().getState());
        app.setPincode(request.getAddress().getPincode());

        if (app.getStatus() == LoanStatus.DRAFT) {
            app.setStatus(LoanStatus.PERSONAL_DETAILS_ADDED);
        }
        logStatusChange(app.getId(), previousStatus, LoanStatus.PERSONAL_DETAILS_ADDED, applicantUsername,
                "Personal details updated");
        try {
            eventPublisher.publishStatusUpdateNotification(app);
        } catch (Exception e) {
            log.warn("Step 1 notification failed for App {}: {}", app.getId(), e.getMessage());
        }
        return repository.save(app);
    }

    public LoanApplication updateEmploymentDetails(String applicantId, String applicantUsername,
            EmploymentDetailsRequest request) {
        LoanApplication app = findActiveApplicationByApplicant(applicantId, applicantUsername)
                .orElseThrow(() -> new ApplicationException("No active application found"));

        checkModifiable(app);

        LoanStatus previousStatus = app.getStatus();
        String empType = normalizeUpper(request.getEmploymentType());
        if (empType != null && !ALLOWED_EMPLOYMENT_TYPES.contains(empType)) {
            throw new ApplicationException("Invalid employment type. Expected one of: " + ALLOWED_EMPLOYMENT_TYPES);
        }
        app.setEmploymentType(empType);
        app.setCompanyName(request.getCompanyName());
        app.setDesignation(request.getDesignation());
        app.setMonthlyIncome(request.getMonthlyIncome());
        app.setExperienceYears(request.getExperienceYears());

        if (app.getStatus() == LoanStatus.PERSONAL_DETAILS_ADDED) {
            app.setStatus(LoanStatus.EMPLOYMENT_DETAILS_ADDED);
        }
        logStatusChange(app.getId(), previousStatus, LoanStatus.EMPLOYMENT_DETAILS_ADDED, applicantUsername,
                "Employment details updated");
        try {
            eventPublisher.publishStatusUpdateNotification(app);
        } catch (Exception e) {
            log.warn("Step 2 notification failed for App {}: {}", app.getId(), e.getMessage());
        }
        return repository.save(app);
    }

    public LoanApplication updateLoanDetails(String applicantId, String applicantUsername,
            LoanDetailsRequest request) {
        LoanApplication app = findActiveApplicationByApplicant(applicantId, applicantUsername)
                .orElseThrow(() -> new ApplicationException("No active application found"));

        checkModifiable(app);

        LoanStatus previousStatus = app.getStatus();
        app.setLoanAmount(request.getLoanAmount());
        app.setTenure(request.getTenureMonths());
        app.setLoanType(request.getLoanType().name());
        app.setPurpose(request.getLoanType().name());

        if (app.getStatus() == LoanStatus.EMPLOYMENT_DETAILS_ADDED) {
            app.setStatus(LoanStatus.LOAN_DETAILS_ADDED);
        }
        logStatusChange(app.getId(), previousStatus, LoanStatus.LOAN_DETAILS_ADDED, applicantUsername,
                "Loan details updated");
        try {
            eventPublisher.publishStatusUpdateNotification(app);
        } catch (Exception e) {
            log.warn("Step 3 notification failed for App {}: {}", app.getId(), e.getMessage());
        }
        return repository.save(app);
    }

    public LoanApplication submitApplicantApplication(String applicantId, String applicantUsername) {
        LoanApplication app = findActiveApplicationByApplicant(applicantId, applicantUsername)
                .orElseThrow(() -> new ApplicationException("No active application found"));
        Long id = app.getId();
        LoanStatus currentStatus = app.getStatus();

        if (currentStatus != LoanStatus.DOCUMENTS_COMPLETED && currentStatus != LoanStatus.DOCS_REUPLOADED) {
            if (checkRequirementsMet(app)) {
                app.setStatus(LoanStatus.DOCUMENTS_COMPLETED);
                app = repository.save(app);
                currentStatus = LoanStatus.DOCUMENTS_COMPLETED;
            }
        }

        if (currentStatus != LoanStatus.DOCUMENTS_COMPLETED && currentStatus != LoanStatus.DOCS_REUPLOADED) {
            throw new ApplicationException(
                    "Application can be submitted only after all required documents are uploaded.");
        }

        LoanStatus previousStatus = app.getStatus();
        app.setStatus(LoanStatus.SUBMITTED);
        app.setSubmittedAt(LocalDateTime.now());
        app.setReuploadModules(null); // Clear any pending re-upload requests on final submission
        LoanApplication saved = repository.save(app);
        logStatusChange(id, previousStatus, LoanStatus.SUBMITTED, applicantUsername,
                "Application submitted successfully");
        eventPublisher.publishApplicationSubmittedEvent(saved);
        
        try {
            createNotification(app.getApplicantUsername(), 
                "Application Submitted", 
                "Your loan application #" + id + " has been successfully submitted for review.", 
                "LOAN_STATUS");
        } catch (Exception e) {
            log.warn("Failed to create in-app notification for submission: {}", e.getMessage());
        }
        
        return saved;
    }

    public List<Map<String, Object>> getApplicantTimeline(Long id, String applicantId, String applicantUsername) {
        LoanApplication app = getApplicantOwnedApplication(id, applicantId, applicantUsername);
        List<LoanStatusHistory> history = historyRepository.findByApplicationId(app.getId());
        List<Map<String, Object>> timeline = new ArrayList<>();

        if (app.getCreatedAt() != null) {
            Map<String, Object> initial = new LinkedHashMap<>();
            initial.put("fromStatus", "NEW");
            initial.put("toStatus", LoanStatus.DRAFT.name());
            initial.put("changedAt", app.getCreatedAt());
            initial.put("changedBy", applicantUsername);
            initial.put("reason", "Application draft created");
            timeline.add(initial);
        }
        history.stream()
                .sorted(Comparator.comparing(LoanStatusHistory::getChangedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .forEach(entry -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("fromStatus", entry.getFromStatus() != null ? entry.getFromStatus().name() : "NEW");
                    map.put("toStatus", entry.getToStatus() != null ? entry.getToStatus().name() : "UNKNOWN");
                    map.put("changedAt", entry.getChangedAt());
                    map.put("changedBy", entry.getChangedBy());
                    map.put("reason", entry.getReason());
                    timeline.add(map);
                });
        return timeline;
    }

    public LoanApplication updateStatus(Long id, LoanStatus newStatus, String role, String loggedInUser, String remarks,
            String reuploadModules) {
        LoanApplication app = getApplicationById(id);
        LoanStatus currentStatus = app.getStatus();

        if (currentStatus == LoanStatus.APPROVED || currentStatus == LoanStatus.REJECTED) {
            throw new InvalidTransitionException("Unauthorized: Application is finalized.");
        }

        if (!ROLE_ADMIN_LITERAL.equalsIgnoreCase(role)) {
            // Security: Ensure applicant owns the record
            getApplicantOwnedApplication(id, null, loggedInUser);
            if (newStatus != LoanStatus.SUBMITTED && newStatus != LoanStatus.DOCS_REUPLOADED) {
                throw new ApplicationException(UNAUTHORIZED_MSG + newStatus);
            }
        }

        if (!isValidTransition(currentStatus, newStatus)) {
            throw new InvalidTransitionException("Decision Blocked: Strict transitions policy violated. Cannot transition from " + currentStatus + " to " + newStatus);
        }

        app.setStatus(newStatus);
        if (LoanStatus.REUPLOAD.equals(newStatus)) {
            app.setReuploadModules(reuploadModules);
        } else {
            app.setReuploadModules(null); // Clear it for any status transition out of REUPLOAD
        }
        LoanApplication savedApp = repository.save(app);

        logStatusChange(id, currentStatus, newStatus, role, remarks != null ? remarks : "Status updated");

        if (LoanStatus.SUBMITTED.equals(newStatus)) {
            eventPublisher.publishApplicationSubmittedEvent(savedApp);
        } else if (newStatus != null) {
            eventPublisher.publishStatusUpdateNotification(savedApp);
        }

        String title = "Application Status Update";
        String message = "Your loan application #" + id + " has been updated to: " + newStatus.name();
        if (LoanStatus.REUPLOAD.equals(newStatus)) {
            title = "Document Re-upload Required";
            message = "Action required: Please re-upload documents for: " + reuploadModules;
        } else if (LoanStatus.APPROVED.equals(newStatus)) {
            title = "Congratulations! Loan Approved";
            message = "Great news! Your loan application #" + id + " has been approved.";
        }
        
        try {
            createNotification(app.getApplicantUsername(), title, message, newStatus.name());
        } catch (Exception e) {
            log.warn("Failed to create in-app notification for app {}: {}", id, e.getMessage());
        }

        return savedApp;
    }

    // OVERLOADED method for backward compatibility and tests
    public LoanApplication updateStatus(Long id, LoanStatus newStatus, String role, String loggedInUser) {
        return updateStatus(id, newStatus, role, loggedInUser, null, null);
    }

    public void syncStatusAfterDocumentUpload(Long applicationId, String documentType) {
        LoanApplication app = getApplicationById(applicationId);
        LoanStatus current = app.getStatus();

        if (current == LoanStatus.APPROVED || current == LoanStatus.REJECTED || current == LoanStatus.UPLOADED) {
            return; // Final or already processed
        }

        boolean allPresent = checkRequirementsMet(app);
        if (!allPresent) {
            log.info("Requirement check failed: Not all 5 mandatory documents are present for app {}", applicationId);
            return; 
        }
        // If all 5 mandatory docs are present, clear the reupload block
        app.setReuploadModules(null);

        if (current == LoanStatus.REUPLOAD) {
             app.setStatus(LoanStatus.DOCS_REUPLOADED);
             logStatusChange(app.getId(), current, LoanStatus.DOCS_REUPLOADED, "SYSTEM", "Automated sync for " + documentType);
        } else if (current == LoanStatus.PARTIAL || current == LoanStatus.DOCS_PENDING || current == LoanStatus.DRAFT) {
             app.setStatus(LoanStatus.DOCUMENTS_COMPLETED);
             logStatusChange(app.getId(), current, LoanStatus.DOCUMENTS_COMPLETED, "SYSTEM", "Automated completion sync for " + documentType);
        }
        
        repository.save(app);
    }

    private boolean checkRequirementsMet(LoanApplication application) {
        try {
            if (application.getLoanType() == null) return false;
            List<DocumentRequirement> requirements = requirementRepository
                    .findByLoanTypeIgnoreCaseAndMandatoryTrue(application.getLoanType());
            Set<String> requiredDocumentTypes = requirements.isEmpty()
                    ? new HashSet<>(DEFAULT_REQUIRED_DOCUMENT_TYPES)
                    : requirements.stream()
                            .map(DocumentRequirement::getDocumentType)
                            .map(String::toUpperCase)
                            .collect(java.util.stream.Collectors.toSet());

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set(HEADER_USER_ROLE, ROLE_ADMIN_LITERAL);
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);

            List<?> uploadedDocs = restTemplate.exchange(DOCUMENT_SERVICE_URL + "/application/" + application.getId(),
                    org.springframework.http.HttpMethod.GET, entity, List.class).getBody();

            if (uploadedDocs == null) return false;

            Set<String> uploadedDocumentTypes = new HashSet<>();
            for (Object obj : uploadedDocs) {
                if (obj instanceof Map<?, ?> map) {
                    Object type = map.get("documentType");
                    if (type != null) uploadedDocumentTypes.add(type.toString().toUpperCase());
                }
            }
            log.info("[SYNC-DEBUG] App {}: Required: {}. Found: {}", application.getId(), requiredDocumentTypes, uploadedDocumentTypes);
            boolean allMet = requiredDocumentTypes.stream().allMatch(uploadedDocumentTypes::contains);
            if (!allMet) {
                log.warn("[SYNC-DEBUG] App {} missing requirements!", application.getId());
            }
            return allMet;

        } catch (Exception e) {
            log.error("Error checking docs for {}: {}", application.getId(), e.getMessage());
            return false;
        }
    }

    private void logStatusChange(Long applicationId, LoanStatus oldStatus, LoanStatus newStatus, String changedBy,
            String comments) {
        LoanStatusHistory history = new LoanStatusHistory();
        history.setApplicationId(applicationId);
        history.setFromStatus(oldStatus);
        history.setToStatus(newStatus);
        history.setChangedBy(changedBy);
        history.setChangedAt(java.time.LocalDateTime.now());
        history.setReason(comments);
        historyRepository.save(history);
    }

    private boolean isValidTransition(LoanStatus current, LoanStatus next) {
        return switch (current) {
            case DRAFT -> next == LoanStatus.SUBMITTED || next == LoanStatus.PERSONAL_DETAILS_ADDED;
            case PERSONAL_DETAILS_ADDED -> next == LoanStatus.EMPLOYMENT_DETAILS_ADDED;
            case EMPLOYMENT_DETAILS_ADDED ->
                next == LoanStatus.LOAN_DETAILS_ADDED || next == LoanStatus.DOCUMENTS_COMPLETED;
            case LOAN_DETAILS_ADDED -> next == LoanStatus.DOCUMENTS_COMPLETED;
            case DOCUMENTS_COMPLETED -> next == LoanStatus.SUBMITTED;
            case SUBMITTED -> next == LoanStatus.DOCS_VERIFIED || next == LoanStatus.DOCS_PENDING
                    || next == LoanStatus.UPLOADED || next == LoanStatus.PARTIAL || next == LoanStatus.REVIEW;
            case DOCS_VERIFIED ->
                next == LoanStatus.APPROVED || next == LoanStatus.REJECTED || next == LoanStatus.REUPLOAD;
            case DOCS_PENDING -> next == LoanStatus.UPLOADED || next == LoanStatus.PARTIAL
                    || next == LoanStatus.REUPLOAD || next == LoanStatus.REJECTED;
            case PARTIAL -> next == LoanStatus.UPLOADED || next == LoanStatus.REUPLOAD;
            case UPLOADED -> next == LoanStatus.REVIEW || next == LoanStatus.REUPLOAD || next == LoanStatus.FAIL
                    || next == LoanStatus.DOCS_VERIFIED;
            case REVIEW ->
                next == LoanStatus.VERIFIED || next == LoanStatus.DOCS_VERIFIED || next == LoanStatus.REUPLOAD
                        || next == LoanStatus.FAIL || next == LoanStatus.REJECTED || next == LoanStatus.DOCS_PENDING;
            case VERIFIED -> next == LoanStatus.APPROVED || next == LoanStatus.REJECTED || next == LoanStatus.REUPLOAD;
            case REUPLOAD ->
                next == LoanStatus.DOCS_REUPLOADED || next == LoanStatus.DOCS_PENDING || next == LoanStatus.PARTIAL
                        || next == LoanStatus.REJECTED || next == LoanStatus.REVIEW || next == LoanStatus.REUPLOAD;
            case DOCS_REUPLOADED -> next == LoanStatus.APPROVED || next == LoanStatus.REJECTED
                    || next == LoanStatus.REUPLOAD || next == LoanStatus.REVIEW || next == LoanStatus.SUBMITTED || next == LoanStatus.DOCS_REUPLOADED;
            case FAIL -> next == LoanStatus.REUPLOAD || next == LoanStatus.REJECTED;
            case APPROVED, REJECTED -> false;
        };
    }

    private LoanApplication getApplicantOwnedApplication(Long id, String applicantId, String applicantUsername) {
        LoanApplication app = getApplicationById(id);
        if (app.getApplicantUsername() == null || !app.getApplicantUsername().equalsIgnoreCase(applicantUsername)) {
            throw new ApplicationException("Applicants can only modify their own applications");
        }
        return app;
    }

    private String normalizeUpper(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }

    private void checkModifiable(LoanApplication app) {
        LoanStatus status = app.getStatus();
        if (status == LoanStatus.APPROVED || status == LoanStatus.REJECTED) {
            throw new ApplicationException("Application is finalized.");
        }
        if (status == LoanStatus.REUPLOAD) return;
        if (status.ordinal() >= LoanStatus.SUBMITTED.ordinal()) {
            throw new ApplicationException("Application is under review.");
        }
    }

    private void createNotification(String applicantUsername, String title, String message, String type) {
        try {
            com.finflow.notification.dto.NotificationRequest notification = com.finflow.notification.dto.NotificationRequest.builder()
                    .to(applicantUsername)
                    .subject(title)
                    .model(java.util.Map.of(
                            "title", title,
                            "message", message,
                            "type", type,
                            "status", type))
                    .build();
            eventPublisher.publishStatusUpdateNotificationDirectly(notification);
        } catch (Exception e) {
            log.warn("Notification bridge failed for {}: {}", applicantUsername, e.getMessage());
        }
    }
}

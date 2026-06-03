package com.finflow.application.repository;

import com.finflow.application.entity.LoanApplication;
import com.finflow.application.entity.LoanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LoanApplicationRepository extends JpaRepository<LoanApplication, Long> {
    List<LoanApplication> findByApplicantUsernameOrderByCreatedAtDesc(String applicantUsername);
    Optional<LoanApplication> findByApplicantUsernameAndStatus(String applicantUsername, LoanStatus status);
    List<LoanApplication> findByApplicantIdOrderByCreatedAtDesc(String applicantId);
    Optional<LoanApplication> findTopByApplicantIdOrderByCreatedAtDesc(String applicantId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(a) > 0 FROM LoanApplication a WHERE a.applicantUsername = :username AND a.status NOT IN (com.finflow.application.entity.LoanStatus.APPROVED, com.finflow.application.entity.LoanStatus.REJECTED)")
    boolean existsActiveApplication(@org.springframework.data.repository.query.Param("username") String username);
}

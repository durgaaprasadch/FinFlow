package com.finflow.application;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@SpringBootTest
@ActiveProfiles("dev") // Ensure it uses the right DB config
public class DbFixerTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void fixDatabaseStatuses() {
        assertDoesNotThrow(() -> {
            System.out.println("Starting Manual Database Fix...");
            
            int appsUpdated = jdbcTemplate.update("UPDATE loan_applications SET status = 'REJECTED' WHERE status = 'CLOSED'");
            System.out.println("Updated " + appsUpdated + " records in loan_applications");
            
            int historyFromUpdated = jdbcTemplate.update("UPDATE loan_status_history SET from_status = 'REJECTED' WHERE from_status = 'CLOSED'");
            System.out.println("Updated " + historyFromUpdated + " records in loan_status_history (from_status)");
            
            int historyToUpdated = jdbcTemplate.update("UPDATE loan_status_history SET to_status = 'REJECTED' WHERE to_status = 'CLOSED'");
            System.out.println("Updated " + historyToUpdated + " records in loan_status_history (to_status)");
            
            System.out.println("Database Fix Completed Successfully!");
        });
    }
}

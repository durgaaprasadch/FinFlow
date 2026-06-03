package com.finflow.auth.dto;

import lombok.Data;

@Data
public class EmailUpdateRequest {
    private String newEmail;
    private String otp;
}

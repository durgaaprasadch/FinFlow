package com.finflow.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DecisionRequest {
    private String decision;
    private String remarks;
    private String reuploadModules;
}

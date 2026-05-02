package com.finflow.application.controller;

import com.finflow.application.dto.ApiResponse;
import com.finflow.application.entity.LoanType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/meta")
@Tag(name = "Metadata", description = "Public metadata for the application")
public class MetadataController {

    @Operation(summary = "Get available loan types")
    @GetMapping("/loan-types")
    public ApiResponse<List<String>> getLoanTypes() {
        return ApiResponse.success("Loan types fetched successfully", 
            Arrays.stream(LoanType.values())
                .map(Enum::name)
                .collect(Collectors.toList()));
    }
}

package com.finflow.application.exception;

public class ApplicationException extends RuntimeException {

    /** Standard Serial Version UID for Serialization */
    private static final long serialVersionUID = 1L;

    public ApplicationException(String message) {
        super(message);
    }
}

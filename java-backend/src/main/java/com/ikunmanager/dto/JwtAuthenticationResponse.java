package com.ikunmanager.dto;

import lombok.Data;

@Data
public class JwtAuthenticationResponse {
    private String accessToken;
    private String tokenType = "Bearer";

    public JwtAuthenticationResponse(String accessToken) {
        this.accessToken = accessToken;
    }

    // Explicitly add getter for tokenType to ensure it's serialized
    public String getTokenType() {
        return tokenType;
    }
}

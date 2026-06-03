package com.finflow.application.config;

import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.DefaultClassMapper;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 🐇 RABBITMQ CONFIGURATION (APPLICATION SERVICE)
 * 
 * This class establishes the infrastructure for the 'Event-Driven' communication 
 * pattern within the FinFlow ecosystem. 
 * 
 * CORE RESPONSIBILITIES:
 * 1. 🧊 Message Serialization: Uses Jackson2Json to convert Java DTOs into 
 *    interoperable JSON payloads for cross-service delivery.
 * 2. 🏛️ Schema Mapping: Maps incoming/outgoing message types (e.g., 'DocumentMessage') 
 *    to local DTO classes, ensuring polymorphic compatibility even if FQCNs differ.
 * 3. 📉 Observation: Enables Spring Cloud Sleuth/Zipkin tracing for messages, 
 *    allowing end-to-end latency visualization from publisher to consumer.
 * 4. 🚀 Reliable Delivery: Configures the RabbitTemplate with optimized 
 *    serialization for high-throughput transactional events.
 */
@Configuration
@SuppressWarnings("null")
public class RabbitMQConfig {
    public static final String DOCUMENT_UPLOADED_QUEUE = "document_uploaded_queue";

    @Bean
    public Jackson2JsonMessageConverter converter() {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        DefaultClassMapper classMapper = new DefaultClassMapper();
        classMapper.setTrustedPackages("*");
        java.util.Map<String, Class<?>> idClassMapping = new java.util.HashMap<>();
        // Notification mapping removed as it belongs to notification-service
        // Logical name for DocumentMessage
        idClassMapping.put("DocumentMessage", com.finflow.application.dto.DocumentMessage.class);
        // Direct FQCN Mapping from document-service (Fallback)
        idClassMapping.put("com.finflow.document.dto.DocumentMessage", com.finflow.application.dto.DocumentMessage.class);
        classMapper.setIdClassMapping(idClassMapping);
        converter.setClassMapper(classMapper);
        return converter;
    }

    @Bean
    @org.springframework.context.annotation.Lazy
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(converter());
        rabbitTemplate.setObservationEnabled(true);
        return rabbitTemplate;
    }
}

package com.tour;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class TourServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(TourServerApplication.class, args);
    }
}

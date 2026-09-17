package com.tour.pojo.vo;

import lombok.Data;

/** 小萧的主动问候 */
@Data
public class GreetingVO {

    /** PROUD / ANNOYED / CARING */
    private String mood;
    private String reply;
}

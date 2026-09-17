package com.tour.pojo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/** 给小萧发消息 */
@Data
public class ChatDTO {

    @NotBlank(message = "说点什么吧")
    @Size(max = 500, message = "一次最多说 500 个字")
    private String message;

    /** 这条消息之前的对话，后端只取最近 10 条 */
    private List<@Valid ChatMessageDTO> history = new ArrayList<>();

    /** 当前行程的条件，还没有行程时为空 */
    @Valid
    private PlanConditions conditions;
}

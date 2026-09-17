package com.tour.pojo.vo;

import lombok.Data;

/** 小萧对一条消息的回复 */
@Data
public class ChatReplyVO {

    /** PLAN 规划 / CHAT 闲聊 */
    private String intent;
    /** PROUD 得意 / ANNOYED 不耐烦 / CARING 关心 */
    private String mood;
    private String reply;
    /** 规划结果，闲聊时为空 */
    private PlanVO plan;
}

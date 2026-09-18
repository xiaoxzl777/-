package com.tour.pojo.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 小萧能不能用，后台顶部据此显示提醒 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiStatusVO {

    private boolean available;
    /** 不能用的原因，比如“DeepSeek 余额不足，请充值”；能用时为空 */
    private String problem;
    /** DeepSeek 余额（元） */
    private String balance;
}

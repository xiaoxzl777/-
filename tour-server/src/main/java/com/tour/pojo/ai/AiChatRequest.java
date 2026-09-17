package com.tour.pojo.ai;

import com.tour.pojo.dto.ChatMessageDTO;
import com.tour.pojo.dto.PlanConditions;
import com.tour.pojo.vo.DistrictVO;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/** 调用 AI 服务 POST /chat 的请求 */
@Data
public class AiChatRequest {

    private String message;
    private List<ChatMessageDTO> history;
    private PlanConditions conditions;
    private LocalDate today;
    private List<DistrictVO> districts;
    private List<AiPoi> pois;
}

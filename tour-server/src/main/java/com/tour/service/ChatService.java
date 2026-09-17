package com.tour.service;

import com.tour.pojo.dto.ChatDTO;
import com.tour.pojo.dto.PlanDTO;
import com.tour.pojo.vo.ChatReplyVO;
import com.tour.pojo.vo.GreetingVO;

/**
 * 和小萧对话：后端把消息和景点数据交给 AI 服务，再把地点信息补全后返回。
 */
public interface ChatService {

    GreetingVO greeting(Long userId);

    ChatReplyVO chat(ChatDTO dto);

    ChatReplyVO plan(PlanDTO dto);
}

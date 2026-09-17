package com.tour.service.impl;

import com.tour.client.AiClient;
import com.tour.common.BusinessException;
import com.tour.mapper.UserMapper;
import com.tour.pojo.ai.AiChatRequest;
import com.tour.pojo.ai.AiPlanRequest;
import com.tour.pojo.dto.ChatDTO;
import com.tour.pojo.dto.ChatMessageDTO;
import com.tour.pojo.dto.PlanDTO;
import com.tour.pojo.entity.Poi;
import com.tour.pojo.entity.User;
import com.tour.pojo.vo.ChatReplyVO;
import com.tour.pojo.vo.GreetingVO;
import com.tour.pojo.vo.PlanItemVO;
import com.tour.service.ChatService;
import com.tour.service.DistrictService;
import com.tour.service.PoiService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    /** 发给 AI 服务的对话最多带最近 10 条 */
    private static final int HISTORY_LIMIT = 10;

    private final UserMapper userMapper;
    private final DistrictService districtService;
    private final PoiService poiService;
    private final AiClient aiClient;

    @Override
    public GreetingVO greeting(Long userId) {
        User user = userMapper.selectById(userId);
        return aiClient.greeting(user == null ? "" : user.getNickname());
    }

    @Override
    public ChatReplyVO chat(ChatDTO dto) {
        LocalDate today = LocalDate.now();
        List<Poi> pois = poiService.listOnline();
        List<ChatMessageDTO> history = dto.getHistory() == null ? List.of() : dto.getHistory();

        AiChatRequest request = new AiChatRequest();
        request.setMessage(dto.getMessage().trim());
        request.setHistory(history.subList(Math.max(0, history.size() - HISTORY_LIMIT), history.size()));
        request.setConditions(dto.getConditions());
        request.setToday(today);
        request.setDistricts(districtService.list());
        request.setPois(poiService.toAiPois(pois, today));
        return fillPlaceInfo(aiClient.chat(request), pois);
    }

    @Override
    public ChatReplyVO plan(PlanDTO dto) {
        LocalDate today = LocalDate.now();
        if (dto.getConditions().getDate().isBefore(today)) {
            throw BusinessException.badRequest("出行日期不能早于今天");
        }
        List<Poi> pois = poiService.listOnline();

        AiPlanRequest request = new AiPlanRequest();
        request.setConditions(dto.getConditions());
        request.setToday(today);
        request.setDistricts(districtService.list());
        request.setPois(poiService.toAiPois(pois, today));
        return fillPlaceInfo(aiClient.plan(request), pois);
    }

    /** AI 服务只返回地点 id，这里补上名称、类型、插画、坐标和官网 */
    private ChatReplyVO fillPlaceInfo(ChatReplyVO reply, List<Poi> pois) {
        if (reply.getPlan() == null || reply.getPlan().getItems() == null) {
            return reply;
        }
        Map<Long, Poi> byId = pois.stream().collect(Collectors.toMap(Poi::getId, Function.identity()));
        for (PlanItemVO item : reply.getPlan().getItems()) {
            Poi poi = byId.get(item.getPoiId());
            if (poi != null) {
                item.setName(poi.getName());
                item.setType(poi.getType());
                item.setIllustration(poi.getIllustration());
                item.setLng(poi.getLng());
                item.setLat(poi.getLat());
                item.setOfficialUrl(poi.getOfficialUrl());
            }
        }
        return reply;
    }
}

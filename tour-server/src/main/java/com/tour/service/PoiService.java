package com.tour.service;

import com.tour.common.PageResult;
import com.tour.pojo.ai.AiPoi;
import com.tour.pojo.dto.ClosedDateDTO;
import com.tour.pojo.dto.OpenRuleDTO;
import com.tour.pojo.dto.PoiQueryDTO;
import com.tour.pojo.dto.PoiSaveDTO;
import com.tour.pojo.entity.Poi;
import com.tour.pojo.vo.PoiDetailVO;
import com.tour.pojo.vo.PoiVO;

import java.time.LocalDate;
import java.util.List;

public interface PoiService {

    /** 用户端：只查已上线的 */
    PageResult<PoiVO> pageForUser(PoiQueryDTO query);

    /** 用户端：已上线景点的详情，闭馆日只返回今天及以后的 */
    PoiDetailVO detailForUser(Long id);

    PageResult<PoiVO> pageForAdmin(PoiQueryDTO query);

    PoiDetailVO detailForAdmin(Long id);

    Long add(PoiSaveDTO dto);

    void update(Long id, PoiSaveDTO dto);

    void updateStatus(Long id, String status);

    /** 整体替换开放时间 */
    void replaceOpenRules(Long id, List<OpenRuleDTO> rules);

    Long addClosedDate(Long id, ClosedDateDTO dto);

    void deleteClosedDate(Long id, Long dateId);

    List<Poi> listOnline();

    /** 把景点整理成发给 AI 服务的格式（带开放时间和 today 以后的闭馆日） */
    List<AiPoi> toAiPois(List<Poi> pois, LocalDate today);
}

package com.tour.service.impl;

import com.tour.common.BusinessException;
import com.tour.common.PageResult;
import com.tour.mapper.DistrictMapper;
import com.tour.mapper.PoiClosedDateMapper;
import com.tour.mapper.PoiMapper;
import com.tour.mapper.PoiOpenRuleMapper;
import com.tour.pojo.ai.AiPoi;
import com.tour.pojo.dto.ClosedDateDTO;
import com.tour.pojo.dto.OpenRuleDTO;
import com.tour.pojo.dto.PoiQueryDTO;
import com.tour.pojo.dto.PoiSaveDTO;
import com.tour.pojo.entity.District;
import com.tour.pojo.entity.Poi;
import com.tour.pojo.entity.PoiClosedDate;
import com.tour.pojo.entity.PoiOpenRule;
import com.tour.pojo.vo.ClosedDateVO;
import com.tour.pojo.vo.OpenRuleVO;
import com.tour.pojo.vo.PoiDetailVO;
import com.tour.pojo.vo.PoiVO;
import com.tour.service.PoiService;
import com.tour.util.ListUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PoiServiceImpl implements PoiService {

    private final PoiMapper poiMapper;
    private final DistrictMapper districtMapper;
    private final PoiOpenRuleMapper openRuleMapper;
    private final PoiClosedDateMapper closedDateMapper;

    @Override
    public PageResult<PoiVO> pageForUser(PoiQueryDTO query) {
        return page(query, true);
    }

    @Override
    public PageResult<PoiVO> pageForAdmin(PoiQueryDTO query) {
        return page(query, false);
    }

    @Override
    public PoiDetailVO detailForUser(Long id) {
        Poi poi = poiMapper.selectById(id);
        if (poi == null || !Poi.ONLINE.equals(poi.getStatus())) {
            throw BusinessException.notFound("景点不存在或已下线");
        }
        return detail(poi, LocalDate.now());
    }

    @Override
    public PoiDetailVO detailForAdmin(Long id) {
        return detail(requirePoi(id), null);
    }

    @Override
    public Long add(PoiSaveDTO dto) {
        Poi poi = toEntity(dto);
        poi.setStatus(Poi.ONLINE);
        poiMapper.insert(poi);
        return poi.getId();
    }

    @Override
    public void update(Long id, PoiSaveDTO dto) {
        requirePoi(id);
        Poi poi = toEntity(dto);
        poi.setId(id);
        poiMapper.update(poi);
    }

    @Override
    public void updateStatus(Long id, String status) {
        if (poiMapper.updateStatus(id, status) == 0) {
            throw BusinessException.notFound("景点不存在");
        }
    }

    @Override
    @Transactional
    public void replaceOpenRules(Long id, List<OpenRuleDTO> rules) {
        requirePoi(id);
        List<PoiOpenRule> entities = new ArrayList<>();
        for (OpenRuleDTO dto : rules) {
            LocalTime open = dto.getOpenTime();
            LocalTime close = dto.getCloseTime();
            LocalTime lastEntry = dto.getLastEntryTime();
            if (!open.isBefore(close)) {
                throw BusinessException.badRequest("开门时间要早于关门时间");
            }
            if (lastEntry != null && (lastEntry.isBefore(open) || lastEntry.isAfter(close))) {
                throw BusinessException.badRequest("停止入场时间要在开门和关门时间之间");
            }
            PoiOpenRule rule = new PoiOpenRule();
            rule.setPoiId(id);
            rule.setWeekdays(ListUtil.join(dto.getWeekdays().stream().distinct().sorted().toList()));
            rule.setOpenTime(open);
            rule.setCloseTime(close);
            rule.setLastEntryTime(lastEntry);
            entities.add(rule);
        }
        openRuleMapper.deleteByPoiId(id);
        if (!entities.isEmpty()) {
            openRuleMapper.insertBatch(entities);
        }
    }

    @Override
    public Long addClosedDate(Long id, ClosedDateDTO dto) {
        requirePoi(id);
        if (closedDateMapper.countByPoiIdAndDate(id, dto.getDate()) > 0) {
            throw BusinessException.badRequest("这一天已经是闭馆日了");
        }
        PoiClosedDate closedDate = new PoiClosedDate();
        closedDate.setPoiId(id);
        closedDate.setClosedDate(dto.getDate());
        closedDate.setReason(StringUtils.hasText(dto.getReason()) ? dto.getReason().trim() : null);
        closedDateMapper.insert(closedDate);
        return closedDate.getId();
    }

    @Override
    public void deleteClosedDate(Long id, Long dateId) {
        if (closedDateMapper.delete(id, dateId) == 0) {
            throw BusinessException.notFound("闭馆日不存在");
        }
    }

    @Override
    public List<Poi> listOnline() {
        return poiMapper.selectOnline();
    }

    @Override
    public List<AiPoi> toAiPois(List<Poi> pois, LocalDate today) {
        if (pois.isEmpty()) {
            return List.of();
        }
        List<Long> ids = pois.stream().map(Poi::getId).toList();
        Map<Long, List<OpenRuleVO>> rules = openRuleMapper.selectByPoiIds(ids).stream()
                .collect(Collectors.groupingBy(PoiOpenRule::getPoiId,
                        Collectors.mapping(this::toRuleVO, Collectors.toList())));
        Map<Long, List<LocalDate>> closedDates = closedDateMapper.selectByPoiIds(ids, today).stream()
                .collect(Collectors.groupingBy(PoiClosedDate::getPoiId,
                        Collectors.mapping(PoiClosedDate::getClosedDate, Collectors.toList())));

        return pois.stream().map(poi -> {
            AiPoi aiPoi = new AiPoi();
            BeanUtils.copyProperties(poi, aiPoi, "tags");
            aiPoi.setTags(ListUtil.splitStrings(poi.getTags()));
            aiPoi.setOpenRules(rules.getOrDefault(poi.getId(), List.of()));
            aiPoi.setClosedDates(closedDates.getOrDefault(poi.getId(), List.of()));
            return aiPoi;
        }).toList();
    }

    private PageResult<PoiVO> page(PoiQueryDTO query, boolean onlineOnly) {
        long total = poiMapper.count(query, onlineOnly);
        if (total == 0) {
            return new PageResult<>(List.of(), 0);
        }
        Map<Long, String> districtNames = districtNames();
        List<PoiVO> list = poiMapper.selectPage(query, onlineOnly).stream()
                .map(poi -> fillVO(new PoiVO(), poi, districtNames))
                .toList();
        return new PageResult<>(list, total);
    }

    private PoiDetailVO detail(Poi poi, LocalDate closedFrom) {
        PoiDetailVO vo = fillVO(new PoiDetailVO(), poi, districtNames());
        vo.setAdminArea(poi.getAdminArea());
        vo.setAddress(poi.getAddress());
        vo.setLng(poi.getLng());
        vo.setLat(poi.getLat());
        vo.setIntro(poi.getIntro());
        vo.setOpenRules(openRuleMapper.selectByPoiId(poi.getId()).stream().map(this::toRuleVO).toList());
        vo.setClosedDates(closedDateMapper.selectByPoiId(poi.getId(), closedFrom).stream()
                .map(d -> new ClosedDateVO(d.getId(), d.getClosedDate(), d.getReason()))
                .toList());
        return vo;
    }

    private <T extends PoiVO> T fillVO(T vo, Poi poi, Map<Long, String> districtNames) {
        vo.setId(poi.getId());
        vo.setType(poi.getType());
        vo.setName(poi.getName());
        vo.setDistrictId(poi.getDistrictId());
        vo.setDistrictName(districtNames.get(poi.getDistrictId()));
        vo.setIllustration(poi.getIllustration());
        vo.setStayMinutes(poi.getStayMinutes());
        vo.setFullDay(poi.getFullDay());
        vo.setTicketPrice(poi.getTicketPrice());
        vo.setAvgCost(poi.getAvgCost());
        vo.setRating(poi.getRating());
        vo.setTags(ListUtil.splitStrings(poi.getTags()));
        vo.setOfficialUrl(poi.getOfficialUrl());
        vo.setStatus(poi.getStatus());
        return vo;
    }

    private OpenRuleVO toRuleVO(PoiOpenRule rule) {
        return new OpenRuleVO(ListUtil.splitInts(rule.getWeekdays()), rule.getOpenTime(), rule.getCloseTime(),
                rule.getLastEntryTime());
    }

    private Poi toEntity(PoiSaveDTO dto) {
        if (districtMapper.selectById(dto.getDistrictId()) == null) {
            throw BusinessException.badRequest("片区不存在");
        }
        boolean restaurant = Poi.RESTAURANT.equals(dto.getType());
        if (restaurant && dto.getAvgCost() == null) {
            throw BusinessException.badRequest("餐厅要填写人均消费");
        }
        Poi poi = new Poi();
        BeanUtils.copyProperties(dto, poi, "tags");
        poi.setName(dto.getName().trim());
        poi.setTags(ListUtil.join(dto.getTags()));
        poi.setOfficialUrl(StringUtils.hasText(dto.getOfficialUrl()) ? dto.getOfficialUrl().trim() : null);
        if (restaurant) {
            // 餐厅没有门票，也不会是全天型
            poi.setTicketPrice(null);
            poi.setFullDay(false);
        } else {
            poi.setAvgCost(null);
            poi.setFullDay(Boolean.TRUE.equals(dto.getFullDay()));
            if (poi.getTicketPrice() == null) {
                poi.setTicketPrice(BigDecimal.ZERO);
            }
        }
        return poi;
    }

    private Poi requirePoi(Long id) {
        Poi poi = poiMapper.selectById(id);
        if (poi == null) {
            throw BusinessException.notFound("景点不存在");
        }
        return poi;
    }

    private Map<Long, String> districtNames() {
        return districtMapper.selectAll().stream().collect(Collectors.toMap(District::getId, District::getName));
    }
}

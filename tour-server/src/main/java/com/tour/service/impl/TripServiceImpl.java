package com.tour.service.impl;

import com.tour.common.BusinessException;
import com.tour.common.PageResult;
import com.tour.mapper.PoiMapper;
import com.tour.mapper.TripItemMapper;
import com.tour.mapper.TripMapper;
import com.tour.pojo.dto.PlanConditions;
import com.tour.pojo.dto.TripItemDTO;
import com.tour.pojo.dto.TripSaveDTO;
import com.tour.pojo.entity.Trip;
import com.tour.pojo.entity.TripItem;
import com.tour.pojo.vo.TripDetailVO;
import com.tour.pojo.vo.TripListVO;
import com.tour.service.TripService;
import com.tour.util.ListUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TripServiceImpl implements TripService {

    private static final int PROMPT_MAX_LENGTH = 500;

    private final TripMapper tripMapper;
    private final TripItemMapper tripItemMapper;
    private final PoiMapper poiMapper;

    @Override
    @Transactional
    public Long save(Long userId, TripSaveDTO dto) {
        List<TripItemDTO> items = dto.getItems().stream()
                .sorted(Comparator.comparing(TripItemDTO::getSeq))
                .toList();
        Set<Long> poiIds = items.stream().map(TripItemDTO::getPoiId).collect(Collectors.toSet());
        if (poiMapper.selectByIds(poiIds).size() != poiIds.size()) {
            throw BusinessException.badRequest("行程里有不存在的地点");
        }

        PlanConditions conditions = dto.getConditions();
        Trip trip = new Trip();
        trip.setUserId(userId);
        trip.setTitle(dto.getTitle().trim());
        trip.setTripDate(conditions.getDate());
        trip.setPrompt(truncate(dto.getPrompt()));
        trip.setStartTime(conditions.getStartTime());
        trip.setAdults(conditions.getAdults());
        trip.setSeniors(conditions.getSeniors());
        trip.setChildren(conditions.getChildren());
        trip.setBudget(conditions.getBudget());
        trip.setPace(conditions.getPace());
        trip.setDistrictIds(ListUtil.join(conditions.getDistrictIds()));
        trip.setMustPoiIds(ListUtil.join(conditions.getMustPoiIds()));
        trip.setAvoidPoiIds(ListUtil.join(conditions.getAvoidPoiIds()));
        trip.setInterests(ListUtil.join(conditions.getInterests()));
        trip.setTotalCost(dto.getTotalCost());
        tripMapper.insert(trip);

        List<TripItem> entities = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            TripItem item = new TripItem();
            BeanUtils.copyProperties(items.get(i), item);
            item.setTripId(trip.getId());
            item.setSeq(i + 1);
            entities.add(item);
        }
        tripItemMapper.insertBatch(entities);
        return trip.getId();
    }

    @Override
    public PageResult<TripListVO> page(Long userId, int page, int size) {
        long total = tripMapper.countByUser(userId);
        List<TripListVO> list = total == 0 ? List.of() : tripMapper.selectPageByUser(userId, (page - 1) * size, size);
        return new PageResult<>(list, total);
    }

    @Override
    public TripDetailVO detail(Long userId, Long id) {
        Trip trip = requireOwnTrip(userId, id);

        PlanConditions conditions = new PlanConditions();
        conditions.setDate(trip.getTripDate());
        conditions.setStartTime(trip.getStartTime());
        conditions.setAdults(trip.getAdults());
        conditions.setSeniors(trip.getSeniors());
        conditions.setChildren(trip.getChildren());
        conditions.setBudget(trip.getBudget());
        conditions.setPace(trip.getPace());
        conditions.setDistrictIds(ListUtil.splitLongs(trip.getDistrictIds()));
        conditions.setMustPoiIds(ListUtil.splitLongs(trip.getMustPoiIds()));
        conditions.setAvoidPoiIds(ListUtil.splitLongs(trip.getAvoidPoiIds()));
        conditions.setInterests(ListUtil.splitStrings(trip.getInterests()));

        TripDetailVO vo = new TripDetailVO();
        vo.setId(trip.getId());
        vo.setTitle(trip.getTitle());
        vo.setPrompt(trip.getPrompt());
        vo.setConditions(conditions);
        vo.setItems(tripItemMapper.selectByTripId(id));
        vo.setTotalCost(trip.getTotalCost());
        vo.setCreatedAt(trip.getCreatedAt());
        return vo;
    }

    @Override
    @Transactional
    public void delete(Long userId, Long id) {
        requireOwnTrip(userId, id);
        tripItemMapper.deleteByTripId(id);
        tripMapper.deleteById(id);
    }

    /** 行程不存在或者不是自己的，都当作不存在 */
    private Trip requireOwnTrip(Long userId, Long id) {
        Trip trip = tripMapper.selectById(id);
        if (trip == null || !trip.getUserId().equals(userId)) {
            throw BusinessException.notFound("行程不存在");
        }
        return trip;
    }

    private String truncate(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            return null;
        }
        String text = prompt.trim();
        return text.length() > PROMPT_MAX_LENGTH ? text.substring(0, PROMPT_MAX_LENGTH) : text;
    }
}

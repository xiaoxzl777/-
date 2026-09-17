package com.tour.service;

import com.tour.common.PageResult;
import com.tour.pojo.dto.TripSaveDTO;
import com.tour.pojo.vo.TripDetailVO;
import com.tour.pojo.vo.TripListVO;

/** 游客的行程，只能操作自己的 */
public interface TripService {

    Long save(Long userId, TripSaveDTO dto);

    PageResult<TripListVO> page(Long userId, int page, int size);

    TripDetailVO detail(Long userId, Long id);

    void delete(Long userId, Long id);
}

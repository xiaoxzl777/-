package com.tour.service;

import com.tour.pojo.dto.DistrictDTO;
import com.tour.pojo.vo.DistrictVO;

import java.util.List;

public interface DistrictService {

    List<DistrictVO> list();

    Long add(DistrictDTO dto);

    void update(Long id, DistrictDTO dto);

    /** 片区下还有景点时不允许删除 */
    void delete(Long id);
}

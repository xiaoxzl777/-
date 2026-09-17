package com.tour.service.impl;

import com.tour.common.BusinessException;
import com.tour.mapper.DistrictMapper;
import com.tour.mapper.PoiMapper;
import com.tour.pojo.dto.DistrictDTO;
import com.tour.pojo.entity.District;
import com.tour.pojo.vo.DistrictVO;
import com.tour.service.DistrictService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DistrictServiceImpl implements DistrictService {

    private final DistrictMapper districtMapper;
    private final PoiMapper poiMapper;

    @Override
    public List<DistrictVO> list() {
        return districtMapper.selectAll().stream()
                .map(d -> new DistrictVO(d.getId(), d.getName(), d.getSort()))
                .toList();
    }

    @Override
    public Long add(DistrictDTO dto) {
        District district = toEntity(dto);
        districtMapper.insert(district);
        return district.getId();
    }

    @Override
    public void update(Long id, DistrictDTO dto) {
        District district = toEntity(dto);
        district.setId(id);
        if (districtMapper.update(district) == 0) {
            throw BusinessException.notFound("片区不存在");
        }
    }

    @Override
    public void delete(Long id) {
        if (poiMapper.countByDistrictId(id) > 0) {
            throw BusinessException.badRequest("片区下还有景点，不能删除");
        }
        if (districtMapper.deleteById(id) == 0) {
            throw BusinessException.notFound("片区不存在");
        }
    }

    private District toEntity(DistrictDTO dto) {
        District district = new District();
        district.setName(dto.getName().trim());
        district.setSort(dto.getSort() == null ? 0 : dto.getSort());
        return district;
    }
}

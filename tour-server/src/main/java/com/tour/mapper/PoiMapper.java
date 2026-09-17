package com.tour.mapper;

import com.tour.pojo.dto.PoiQueryDTO;
import com.tour.pojo.entity.Poi;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.Collection;
import java.util.List;

/** 复杂一点的 SQL 写在 resources/mapper/PoiMapper.xml */
public interface PoiMapper {

    /** 分页查询；onlineOnly 为 true 时只查已上线的 */
    List<Poi> selectPage(@Param("q") PoiQueryDTO query, @Param("onlineOnly") boolean onlineOnly);

    long count(@Param("q") PoiQueryDTO query, @Param("onlineOnly") boolean onlineOnly);

    @Select("SELECT * FROM poi WHERE id = #{id}")
    Poi selectById(Long id);

    List<Poi> selectByIds(@Param("ids") Collection<Long> ids);

    @Select("SELECT * FROM poi WHERE status = 'ONLINE' ORDER BY id")
    List<Poi> selectOnline();

    @Select("SELECT COUNT(*) FROM poi WHERE district_id = #{districtId}")
    long countByDistrictId(Long districtId);

    int insert(Poi poi);

    int update(Poi poi);

    @Update("UPDATE poi SET status = #{status} WHERE id = #{id}")
    int updateStatus(@Param("id") Long id, @Param("status") String status);
}

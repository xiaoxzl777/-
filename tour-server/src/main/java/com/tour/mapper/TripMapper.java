package com.tour.mapper;

import com.tour.pojo.entity.Trip;
import com.tour.pojo.vo.TripListVO;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface TripMapper {

    int insert(Trip trip);

    List<TripListVO> selectPageByUser(@Param("userId") Long userId, @Param("offset") int offset,
                                      @Param("size") int size);

    @Select("SELECT COUNT(*) FROM trip WHERE user_id = #{userId}")
    long countByUser(Long userId);

    @Select("SELECT * FROM trip WHERE id = #{id}")
    Trip selectById(Long id);

    @Delete("DELETE FROM trip WHERE id = #{id}")
    int deleteById(Long id);
}

package com.tour.common;

import lombok.Data;

/**
 * 统一返回格式：{ code, message, data }，code 为 0 表示成功。
 */
@Data
public class Result<T> {

    private int code;
    private String message;
    private T data;

    public static <T> Result<T> ok(T data) {
        Result<T> result = new Result<>();
        result.code = ErrorCode.OK;
        result.message = "ok";
        result.data = data;
        return result;
    }

    public static Result<Void> ok() {
        return ok(null);
    }

    public static <T> Result<T> fail(int code, String message) {
        Result<T> result = new Result<>();
        result.code = code;
        result.message = message;
        return result;
    }
}

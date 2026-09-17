package com.tour.common;

/**
 * 返回码，含义见接口文档第 2 节。
 */
public final class ErrorCode {

    public static final int OK = 0;
    public static final int BAD_REQUEST = 400;
    public static final int UNAUTHORIZED = 401;
    public static final int FORBIDDEN = 403;
    public static final int NOT_FOUND = 404;
    public static final int SERVER_ERROR = 500;
    public static final int AI_UNAVAILABLE = 503;

    private ErrorCode() {
    }
}

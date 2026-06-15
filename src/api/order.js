import http from '@/common/request'

/** 获取订单列表 */
export function getOrderList(data) {
    return http.get('/f/la/commerce/orders', data, {
        loading: true,
        auth: true,
    })
}

/** 获取商品列表 */
export function getGoodsList(data) {
    return http.get('/f/la/commerce/goods', data, {
        loading: true,
        auth: true,
    })
}

/** 创建订单 */
export function createOrder(data) {
    return http.post('/f/la/commerce/order/create', data, {
        loading: true,
        auth: true,
    })
}
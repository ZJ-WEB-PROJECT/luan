import provinces from './province.js'
import cities from './city.js'
import areas from './area.js'

function findIndexByLabel(list, label) {
  if (!label || !Array.isArray(list)) return 0
  const idx = list.findIndex((item) => item.label === label)
  return idx >= 0 ? idx : 0
}

/** 构建 up-picker 三列初始数据 */
export function buildRegionColumns(provinceIndex = 0, cityIndex = 0) {
  const safeProvinceIndex = Math.min(Math.max(provinceIndex, 0), provinces.length - 1)
  const cityList = cities[safeProvinceIndex] || []
  const safeCityIndex = Math.min(Math.max(cityIndex, 0), Math.max(cityList.length - 1, 0))
  const areaList = areas[safeProvinceIndex]?.[safeCityIndex] || []
  return [provinces, cityList, areaList]
}

/** 根据名称查找省市区索引 */
export function findRegionIndexes(provinceLabel, cityLabel, districtLabel) {
  const provinceIndex = findIndexByLabel(provinces, provinceLabel)
  const cityList = cities[provinceIndex] || []
  const cityIndex = findIndexByLabel(cityList, cityLabel)
  const areaList = areas[provinceIndex]?.[cityIndex] || []
  const areaIndex = findIndexByLabel(areaList, districtLabel)
  return { provinceIndex, cityIndex, areaIndex }
}

/** 格式化为 省/市/区 文本 */
export function formatRegionText(labels) {
  return [labels.province, labels.city, labels.district].filter(Boolean).join('/')
}

/** 列联动：省变化 */
export function getCityListByProvinceIndex(provinceIndex) {
  return cities[provinceIndex] || []
}

/** 列联动：市变化 */
export function getAreaListByIndexes(provinceIndex, cityIndex) {
  return areas[provinceIndex]?.[cityIndex] || []
}

export { provinces, cities, areas }

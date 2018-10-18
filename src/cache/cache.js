// import { JS_CACHE_KEY } from '../config.js'

let _cache = {}
let _hitCount = 0
let _missCount = 0
let _size = 0
let _debug = false

export class Cache {
  constructor() {
    // TODO
  }

  put(key, value, time = 600000, timeoutCallback) {
    _debug && console.log('caching: %s = %j (@%s)', key, value, time)

    let oldRecord = _cache[key]
    if (oldRecord) {
      clearTimeout(oldRecord.timeout)
    } else {
      _size++
    }

    let record = {
      value: value,
      expire: time + Date.now()
    }

    if (!isNaN(record.expire)) {
      record.timeout = setTimeout(() => {
        this._del(key)
        if (timeoutCallback) {
          timeoutCallback(key, value)
        }
      }, time)
    }

    _cache[key] = record

    return value
  }

  del(key) {
    let canDelete = true

    let oldRecord = _cache[key]
    if (oldRecord) {
      clearTimeout(oldRecord.timeout)
      if (!isNaN(oldRecord.expire) && oldRecord.expire < Date.now()) {
        canDelete = false
      }
    } else {
      canDelete = false
    }

    if (canDelete) {
      this._del(key)
    }

    return canDelete
  }

  _del(key) {
    _size--
    delete _cache[key]
  }

  reset() {
    for (let key in _cache) {
      clearTimeout(_cache[key].timeout)
    }
    _size = 0
    _cache = Object.create(null)
    if (_debug) {
      _hitCount = 0
      _missCount = 0
    }
  }

  get(key) {
    let data = _cache[key]
    if (typeof data !== 'undefined') {
      if (isNaN(data.expire) || data.expire >= Date.now()) {
        _debug && _hitCount++
        console.log('hit:', key)
        return data.value
      } else {
        _debug && _missCount++
        _size--
        delete _cache[key]
      }
    } else if (_debug) {
      _missCount++
    }
    return null
  }

  size() {
    return _size
  }

  memsize() {
    return Object.keys(_cache).length
  }

  debug(bool) {
    _debug = bool
  }

  hits() {
    return _hitCount
  }

  misses() {
    return _missCount
  }

  keys() {
    return Object.keys(_cache)
  }

  unserialize() {
    // TODO
    console.log('unserialize: %j', _cache)
  }

  serialize(jsonToImport) {
    let cacheToImport = {}
    if (jsonToImport) {
      cacheToImport = JSON.parse(jsonToImport)
    }
    let currTime = Date.now()

    for (let key in cacheToImport) {
      if (!cacheToImport.hasOwnProperty(key)) {
        continue
      }
      let record = cacheToImport[key]
      let remainingTime = record.expire - currTime

      if (remainingTime <= 0) {
        this.del(key)
        continue
      }

      remainingTime = remainingTime > 0 ? remainingTime : undefined
      this.put(key, record.value, remainingTime)
    }

    return this.size()
  }
}

let cache = new Cache()

export default cache


/**
 * sqlite for auto.js
 * @example
 *  let db = SqliteHelper("/sdcard/xxx辅助/数据库/", "data.db");
 * @param {*} filePath 地址
 * @param {*} fileName 文件名
 */
function SqliteHelper(filePath, fileName) {
  // 导入必要的class
  importClass(android.database.sqlite.SQLiteDatabase);
  importClass(android.content.ContentValues);

  function SQLiteSDK(filePath, fileName) {
    /**
     * 文件名
     * @private
     */
    this._dbName = fileName;

    /**
     * 数据库文件地址
     * @private
     */
    this._dbFilePath = filePath + this._dbName;
  }


  /** 根据 json 键值 快速建表
   * @public
   * @param {*} tableName 表名
   * @param {*} data json数据
   * @param {*} uniqueArr 唯一
   */
  SQLiteSDK.prototype.fastCreateTable = function (tableName, data, uniqueArr) {
    let columnArr = [];
    let itemName = "";

    // 拼接数据类型
    for (let key in data) {
      //_log((typeof data[key])  + data[key])
      switch (typeof data[key]) {
        case "number":
          itemName = key + " INTEGER DEFAULT 0";
          break;
        case "boolean":
          itemName = key + " INTEGER DEFAULT 0";
          break;
        default:
          itemName = key + " TEXT DEFAULT ''";
          break;
      }

      if (uniqueArr.indexOf(key) > -1) {
        itemName += " unique";
      }
      columnArr.push(itemName);
    }
    // 创建
    this.createTable(tableName, columnArr);
  };

  /** 创建表
   * @public
   * @param {string} tableName 表名
   * @param {string[]} columns 参数列名 数组, 源码中会用 逗号隔开
   */
  SQLiteSDK.prototype.createTable = function (tableName, columns) {
    this._log("init");
    try {
      files.ensureDir(this._dbFilePath);
      this.execSQL("create table IF NOt EXISTS " + tableName + "(id integer primary key autoincrement," + columns.join(",") + ")");
    } catch (e) {
      this._error("createTable error: " + e);
    }
  };

  /** 查询
   * @public
   * @example
   * db.find("select * from " + tableName + " where weibo_UserName='13235919724'");
   * @param {string} sqlStr sql字符串
   * @returns {object[]} json 数组
   */
  SQLiteSDK.prototype.find = function (sqlStr) {
    this._log("find");
    let res = [];
    let db;
    try {
      db = this._getDBConnection();
      res = this._getCursorDataArr(db.rawQuery(sqlStr, null));
    } catch (e) {
      this._error("find error: " + e);
    } finally {
      db ? db.close() : "";
    }
    return res;
  };

  /** 插入
   * 
   * @public
   * @param {表明} tableName  表明
   * @param {object} jsonObj json数据对象
   * @param {string?} nullColumnHack  可以不传,一般为null即可   https://www.iteye.com/blog/mofan-1412262
   * @returns {number} 插入的行ID；如果发生错误，则返回-1
   */
  SQLiteSDK.prototype.insert = function (tableName, jsonObj, nullColumnHack) {
    this._log("insert");
    nullColumnHack = nullColumnHack || null;
    let res = -1;
    let db;
    try {
      db = this._getDBConnection();
      db.beginTransaction();
      res = db.insert(tableName, nullColumnHack, this._getContentValues(jsonObj));
      db.setTransactionSuccessful(); //设置事务处理成功，不设置会自动回滚不提交。
    } catch (e) {
      this._error("insert error: " + e);
    } finally {
      db ? db.endTransaction() : "";
      db ? db.close() : "";
    }
    return res;
  };

  /** 删除
   * @public
   * @example
   * db.delete(tableName,"weibo_UserName=?",["1名字"])
   * @param {string} tableName 表名
   * @param {string} whereClause where 条件
   * @param {string[]} whereArgs where 条件的参数
   * @returns {number} 如果传入whereClause，则受影响的行数，否则为0 。要删除所有行并获得计数，请将“1”作为 whereClause。
   */
  SQLiteSDK.prototype.delete = function (tableName, whereClause, whereArgs) {
    this._log("delete");
    let res = 0;
    let db;
    try {
      db = this._getDBConnection();
      db.beginTransaction();
      res = db.delete(tableName, whereClause, whereArgs);
      db.setTransactionSuccessful(); //设置事务处理成功，不设置会自动回滚不提交。
    } catch (e) {
      this._error("delete error: " + e);
    } finally {
      db ? db.endTransaction() : "";
      db ? db.close() : "";
    }
    return res;
  };

  /** 更新
   * @public
   * @example
   * db.update(tableName,{"weibo_NickName":"哈哈哈"},"weibo_UserName=?",["13235919724"])
   * @param {string} tableName 表名
   * @param {object} jsonObj json对象
   * @param {string} whereClause where 条件
   * @param {string[]} whereArgs where 条件的参数
   * @returns {number} 受影响的行数
   */
  SQLiteSDK.prototype.update = function (tableName, jsonObj, whereClause, whereArgs) {
    this._log("update");
    let res = 0;
    let db;
    try {
      db = this._getDBConnection();
      res = db.update(tableName, this._getContentValues(jsonObj), whereClause, whereArgs);
    } catch (e) {
      this._error("update error: " + e);
    } finally {
      db ? db.close() : "";
    }
    return res;
  };

  /** 替换数据库中一行的便捷方法。 如果行不存在，则插入新行。
   * 
   * !!!! 当表有一个PRIMARY KEY或UNIQUE索引才有意义
   * @public
   * @example
   * https://blog.csdn.net/wangyanguiyiyang/article/details/51126590
   * @param {string} tableName 表名
   * @param {object} jsonObj json对象
   * @param {string?} nullColumnHack 一般为null即可   https://www.iteye.com/blog/mofan-1412262
   * @returns {number} 新插入的行的行ID；如果发生错误，则返回-1
   */
  SQLiteSDK.prototype.replace = function (tableName, jsonObj, nullColumnHack) {
    nullColumnHack = nullColumnHack || null;
    let res = -1;
    let db;
    try {
      db = this._getDBConnection();

      res = db.replace(tableName, nullColumnHack, this._getContentValues(jsonObj));
    } catch (e) {
      this._error("replace error: " + e);
    } finally {
      db ? db.close() : "";
    }
    return res;
  };


  /** 删除表
   * @public
   * @param {string} tableName 表名
   */
  SQLiteSDK.prototype.dropTable = function (tableName) {
    try {
      this.execSQL("drop table if exists " + tableName);
    } catch (e) {
      this._error("dropTable error: " + e);
    }
  };

  /** 清空表
   * @public
   * @param {string} tableName 表名
   */
  SQLiteSDK.prototype.clearTable = function (tableName) {
    try {
      this.execSQL("delete from " + tableName);
    } catch (e) {
      this._error("clearTable error: " + e);
    }
  };

  /** 表索引序列归0
   * @public
   * @param {string} tableName 表名
   */
  SQLiteSDK.prototype.resetTableSequence = function (tableName) {
    try {
      db.execSQL("UPDATE sqlite_sequence SET seq = 0 WHERE name = '" + tableName + "'");
    } catch (e) {
      this._error("resetTableSequence error: " + e);
    }
  };

  /** 执行sql
   * @public
   * @param {string} sqlStr
   */
  SQLiteSDK.prototype.execSQL = function (sqlStr) {
    let db;
    try {
      db = this._getDBConnection();
      db.execSQL(sqlStr);
    } catch (e) {
      throw e;
    } finally {
      db ? db.close() : "";
    }
  };
  
  /** 需要升级
   * @public
   * @param {number} newVersion  版本号 数字
   * @returns {boolean} 如果新版本代码大于当前数据库版本，则返回true。
   */
  SQLiteSDK.prototype.needUpgrade = function (newVersion) {
    let res = false;
    let db;
    try {
      db = this._getDBConnection();
      res = db.needUpgrade(newVersion);
    } catch (e) {
      this._error("needUpgrade error:" + e);
    } finally {
      db ? db.close() : "";
    }
    return res;
  };

  /** 删除数据库文件
   * @public
   */
  SQLiteSDK.prototype.deleteDbFile = function () {
    if (files.exists(this._dbFilePath)) {
      files.remove(this._dbFilePath);
      this._log("数据库删除成功,地址:" + this._dbFilePath);
    }
  };

  //#region 私有方法
  
  /** 获取 游标里的 数据
   * 
   * @private
   * @param {string} cursor 游标
   * @returns {object[]} json 数组
   */
  SQLiteSDK.prototype._getCursorDataArr = function (cursor) {
    let res = [];
    if (cursor) {
      try {
        cursor.moveToFirst();
        this._log("cursor count: " + cursor.getCount());

        let columnNameArr = cursor.getColumnNames();

        if (cursor.getCount() > 0) {
          do {
            let resItem = {};
            for (let nameIndex = 0; nameIndex < columnNameArr.length; nameIndex++) {
              let nameItem = columnNameArr[nameIndex];
              let columnIndex = cursor.getColumnIndex(nameItem);
              if (columnIndex > -1) {
                let itemValue;
                switch (cursor.getType(columnIndex)) {
                  case 0: // FIELD_TYPE_NULL 0
                    itemValue = null;
                    break;
                  case 1: // FIELD_TYPE_INTEGER 1
                    itemValue = cursor.getInt(columnIndex);
                    break;
                  case 2: // FIELD_TYPE_FLOAT 2
                    itemValue = cursor.getFloat(columnIndex);
                    break;
                  case 3: // FIELD_TYPE_STRING 3
                    itemValue = cursor.getString(columnIndex);
                    break;
                  case 4: // FIELD_TYPE_BLOB 4
                    itemValue = cursor.getBlob(columnIndex);
                    break;
                  default:
                    itemValue = cursor.getString(columnIndex);
                    break;
                }
                resItem[nameItem] = itemValue;
              }
            }
            res.push(resItem);
          } while (cursor.moveToNext());
        }
      } catch (e) {
        this._error("_getCursorDataArr error: " + e);
      } finally {
        cursor.close();
      }
    }
    return res;
  };

  /** 获取 contentValues    --------   (json转 contentValues)
   * 
   * @private
   * @param {object} jsonObj json对象
   * @returns ContentValues对象
   */
  SQLiteSDK.prototype._getContentValues = function (jsonObj) {
    let cv = new ContentValues();
    if (jsonObj) {
      for (let key in jsonObj) {
        let item = jsonObj[key];
        switch (typeof item) {
          case "number":
            cv.put(key, java.lang.Integer(item));
            break;
          case "boolean":
            cv.put(key, java.lang.Boolean(item));
            break;
          case "boolean":
            cv.put(key, java.lang.Boolean(item));
            break;
          default:
            cv.put(key, java.lang.String(item));
            break;
        }
      }
    }

    /**
    void put(java.lang.String,java.lang.Long)
    void put(java.lang.String,java.lang.Byte)
    void put(java.lang.String,java.lang.Double)
    void put(java.lang.String,java.lang.Float)
    void put(java.lang.String,java.lang.Integer)
    void put(java.lang.String,java.lang.Short)
     */
    return cv;
  };
  
  /** log日志
   * 
   * @private
   * @param {*} msg
   */
  SQLiteSDK.prototype._log = function (msg) {
    console.log(msg);
  };

  /** error日志
   * 
   * @private
   * @param {any} msg
   */
  SQLiteSDK.prototype._error = function (msg) {
    console.error(msg);
  };

  /** 获取 db连接对象
   * 
   * @private
   */
  SQLiteSDK.prototype._getDBConnection = function () {
    return SQLiteDatabase.openOrCreateDatabase(this._dbFilePath, null);
  };

  //#endregion 私有方法

  return new SQLiteSDK(filePath, fileName);
}

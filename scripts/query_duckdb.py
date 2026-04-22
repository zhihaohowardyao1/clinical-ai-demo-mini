#!/usr/bin/env python3
import json
import sys

import duckdb


def main():
    payload = json.load(sys.stdin)
    db_path = payload["db_path"]
    sql = payload["sql"]

    con = duckdb.connect(db_path, read_only=True)
    try:
      cursor = con.execute(sql)
      columns = [desc[0] for desc in cursor.description]
      rows = cursor.fetchall()
      serializable_rows = [dict(zip(columns, row)) for row in rows]
      print(json.dumps({"columns": columns, "rows": serializable_rows, "warnings": []}, default=str))
    finally:
      con.close()


if __name__ == "__main__":
    main()

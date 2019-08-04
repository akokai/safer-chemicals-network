import json
import sys
import pandas as pd


def to_json(excel_file):
    data = pd.read_excel(excel_file, sheet_name=[0, 1], dtype="str", index_col=None)
    nodes = list(data[0].fillna("NA").to_dict(orient="index").values())
    edges = list(
        data[1]
        .drop(["_from", "_to"], axis=1)
        .fillna("NA")
        .to_dict(orient="index")
        .values()
    )
    return {"nodes": nodes, "edges": edges}


def main():
    print(f"Converting {sys.argv[1]}")
    data = to_json(sys.argv[1])
    with open("data/network.json", "w") as out_json:
        json.dump(data, out_json, indent=2, allow_nan=False)


if __name__ == "__main__":
    main()

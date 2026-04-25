"""
Seed MongoDB Atlas with ALL 2.7M records from local MongoDB.
Warning: This will exceed the 512MB free tier limit on MongoDB Atlas.
"""

import sys
import pymongo

LOCAL_URI = "mongodb://localhost:27017"
LOCAL_DB  = "taxi_anomaly_db"
BATCH     = 10000

def main():
    if len(sys.argv) < 2:
        print("Usage: python seed_atlas_full.py <ATLAS_MONGODB_URI>")
        sys.exit(1)

    atlas_uri = sys.argv[1]
    print(f"[*] Connecting to local MongoDB ({LOCAL_URI}) ...")
    local_client = pymongo.MongoClient(LOCAL_URI)
    local_db = local_client[LOCAL_DB]

    print(f"[*] Connecting to Atlas ...")
    atlas_client = pymongo.MongoClient(atlas_uri)
    atlas_db_name = atlas_uri.split('/')[-1].split('?')[0] or LOCAL_DB
    atlas_db = atlas_client[atlas_db_name]

    try:
        atlas_client.admin.command('ping')
        print("    ✅ Atlas connected!")
    except Exception as e:
        print(f"    ❌ Atlas connection failed: {e}")
        sys.exit(1)

    for col_name in ['rides', 'anomalies']:
        print(f"\n[*] Syncing collection: {col_name}")
        local_col = local_db[col_name]
        atlas_col = atlas_db[col_name]

        local_count = local_col.count_documents({})
        print(f"    Local {col_name}: {local_count:,}")

        print(f"    Dropping Atlas collection '{col_name}' ...")
        atlas_col.drop()

        cursor = local_col.find({}, {'_id': 0})
        batch = []
        inserted = 0

        try:
            for doc in cursor:
                batch.append(doc)
                if len(batch) >= BATCH:
                    atlas_col.insert_many(batch, ordered=False)
                    inserted += len(batch)
                    batch = []
                    sys.stdout.write(f"\r    Inserted: {inserted:,} / {local_count:,}")
                    sys.stdout.flush()

            if batch:
                atlas_col.insert_many(batch, ordered=False)
                inserted += len(batch)
            print(f"\r    Inserted: {inserted:,} / {local_count:,}")
            
            # Indexes
            print(f"\n    Creating indexes for {col_name}...")
            if col_name == 'rides':
                for f in ['ride_id', 'pickup_date', 'fare_amount']:
                    atlas_col.create_index(f)
            elif col_name == 'anomalies':
                for f in ['ride_id', 'anomaly_score', 'is_anomaly', 'pickup_date']:
                    atlas_col.create_index(f)
            print(f"    ✅ Indexes created.")

        except pymongo.errors.BulkWriteError as bwe:
            print(f"\n    ❌ BulkWriteError: Atlas limit likely reached. Uploaded {inserted:,} documents before failing.")
            print(bwe.details)
            sys.exit(1)
        except Exception as e:
            print(f"\n    ❌ Error: {e}")
            sys.exit(1)

    atlas_client.close()
    local_client.close()
    print("\n🎉 Done! All 2.7M records pushed.")

if __name__ == '__main__':
    main()

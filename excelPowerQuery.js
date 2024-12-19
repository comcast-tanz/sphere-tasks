let
    Source = Json.Document(File.Contents("C:\Users\tanne\OneDrive - Comcast\Sphere\Tasks\Obtain_Permits_Tasks__JACKSON___MEMPHIS___MOBILE, AL___SHREVEPORT___SOUTH LOUISIANA_.json")),
    
    #"Converted" = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Ignore),

    #"ColumnNames" = List.Distinct(List.Combine(List.Transform(#"Converted"[Column1], each Record.FieldNames(_)))),

    #"Expanded" = Table.ExpandRecordColumn(#"Converted", "Column1", #"ColumnNames", #"ColumnNames"),

    #"RemoveBlanks" = Table.SelectRows(#"Expanded", each List.RemoveMatchingItems(Record.FieldValues(_), {"", null}) <> {}),

    #"JobURL" = Table.AddColumn(#"RemoveBlanks", "Job URL", each "https://sphere.comcast.com/app/job/" & [#"job/id"] & "/permits"),

    #"TaskURL" = Table.AddColumn(#"JobURL", "Task URL", each "https://sphere.comcast.com/app/task/" & [#"canonical-id"] & "/detail"),

    #"Reordered1" = Table.ReorderColumns(#"TaskURL", {"Job URL", "Task URL", "job/id", "canonical-id", "job/market", "job/eccd", "due-date", "status", "business-partner-name", "can-be-approved", "permits/total", "permits/received", "permits/expired", "job/region", "job/area", "job/category", "job/status", "job/description", "job/type", "job/subtype", "job/owner", "description", "type", "creator", "owner", "modifier", "created-date", "completed-date", "last-modified-date", "info-requested-at", "info-provided-at", "scheduled-date", "assigned-at", "reassigned-at", "accepted-at", "approved-at", "approval-requested-at", "cancelled-at"}),

    #"Removed" = Table.RemoveColumns(#"Reordered1",{"group-name", "data", "qc-results", "node-housing-id", "material-need-by", "last-modified-by-id", "id", "info-unrequested-at", "created-by-id", "salesforce-id", "job-id", "group-id", "origin-system", "progress-order", "survey-type", "milestone", "owner-id", "dlink-checksum", "child-node", "salesforce-job-id", "business-partner-name-fallback", "name", "description"}),

    #"Sorted" = Table.Sort(#"Removed",{{"due-date", Order.Ascending}, {"status", Order.Ascending}}),

    #"ChangedType" = Table.TransformColumnTypes(#"Sorted",{{"assigned-at", type datetime}, {"job/eccd", type date}, {"created-date", type datetime}, {"due-date", type date}, {"last-modified-date", type datetime}, {"approved-at", type datetime}, {"accepted-at", type datetime}, {"cancelled-at", type datetime}, {"approval-requested-at", type datetime}, {"reassigned-at", type datetime}, {"scheduled-date", type date}, {"can-be-approved", type logical}, {"permits/received", Int64.Type}, {"permits/expired", Int64.Type}, {"permits/total", Int64.Type} }),

    #"DateType" = Table.TransformColumns(#"ChangedType", {{"due-date", each try Date.From(_) otherwise null, type date}}),

    #"Reordered2" = Table.ReorderColumns(#"DateType",
        let
            RemovedColumns = List.RemoveItems(Table.ColumnNames(#"DateType"), {"is-overdue", "days-until-due", "job/extend-eccd"}),

            InsertedIsOverdue = List.InsertRange(
                RemovedColumns,
                List.PositionOf(Table.ColumnNames(#"DateType"), "can-be-approved") + 1,
                {"is-overdue"}
            ),

            InsertedUntilDue = List.InsertRange(
                InsertedIsOverdue,
                List.PositionOf(InsertedIsOverdue, "is-overdue") + 1,
                {"days-until-due"}
            ),

            FinalList = List.InsertRange(
                InsertedUntilDue,
                List.PositionOf(InsertedUntilDue, "days-until-due") + 1,
                {"job/extend-eccd"}
            )
        in
            FinalList
    )

in
    #"Reordered2"
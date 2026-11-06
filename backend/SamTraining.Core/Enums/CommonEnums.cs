using System;

namespace SamTraining.Core.Enums
{
    public enum DatasetSplit
    {
        Train = 0,
        Validation = 1,
        Test = 2
    }

    public enum TrainingJobStatus
    {
        Queued = 0,
        Running = 1,
        Completed = 2,
        Failed = 3,
        Cancelled = 4
    }

    public enum CaptureSource
    {
        Web = 0,
        Mobile = 1,
        Api = 2
    }
}

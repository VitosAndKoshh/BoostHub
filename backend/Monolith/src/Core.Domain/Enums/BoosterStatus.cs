using Core.Domain.Errors.Booster;
using Core.Domain.Exceptions;

namespace Core.Domain.Enums;

public enum BoosterStatus
{
    Pending,
    Active,
    Banned
}

public static class BoosterStatusExtensions{
    public static BoosterStatus TryParse(this string status)
    {
        if (Enum.TryParse(status, true, out BoosterStatus result))
            return result;

        throw new DomainException(BoosterErrors.InvalidStatus);
    }
}
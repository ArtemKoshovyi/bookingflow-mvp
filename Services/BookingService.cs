using BookingApp.Data;
using BookingApp.Dtos;
using BookingApp.Models;
using Microsoft.EntityFrameworkCore;

namespace BookingApp.Services;

public class BookingService
{
    private readonly AppDbContext _context;

    public BookingService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(bool Success, string Error, Booking? Booking)> CreateBookingAsync(CreateBookingRequest request)
    {
        var worker = await _context.Workers.FirstOrDefaultAsync(w => w.Id == request.WorkerId);
        if (worker is null)
        {
            return (false, "Worker not found.", null);
        }

        var service = await _context.Services
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId && s.WorkerId == request.WorkerId);

        if (service is null)
        {
            return (false, "Service not found for this worker.", null);
        }

        var start = request.StartTimeUtc;
        var end = start.AddMinutes(service.DurationMinutes);

        if (start < DateTime.UtcNow)
        {
            return (false, "Cannot create booking in the past.", null);
        }

        // Пример простого рабочего времени: 08:00 - 18:00 UTC
        var hour = start.Hour;
        if (hour < 8 || hour >= 18)
        {
            return (false, "Selected time is outside working hours.", null);
        }

        var overlapExists = await _context.Bookings.AnyAsync(b =>
            b.WorkerId == request.WorkerId &&
            start < b.EndTimeUtc &&
            end > b.StartTimeUtc);

        if (overlapExists)
        {
            return (false, "Selected time slot is already booked.", null);
        }

        var booking = new Booking
        {
            ClientName = request.ClientName,
            ClientEmail = request.ClientEmail,
            ClientPhone = request.ClientPhone,
            WorkerId = request.WorkerId,
            ServiceId = request.ServiceId,
            StartTimeUtc = start,
            EndTimeUtc = end
        };

        _context.Bookings.Add(booking);
        await _context.SaveChangesAsync();

        return (true, string.Empty, booking);
    }

    public async Task<List<DateTime>> GetAvailableSlotsAsync(int workerId, int serviceId, DateTime dayUtc)
    {
        var service = await _context.Services
            .FirstOrDefaultAsync(s => s.Id == serviceId && s.WorkerId == workerId);

        if (service is null)
        {
            return new List<DateTime>();
        }

        var bookings = await _context.Bookings
            .Where(b => b.WorkerId == workerId &&
                        b.StartTimeUtc.Date == dayUtc.Date)
            .ToListAsync();

        var slots = new List<DateTime>();

        var workDayStart = new DateTime(dayUtc.Year, dayUtc.Month, dayUtc.Day, 8, 0, 0, DateTimeKind.Utc);
        var workDayEnd = new DateTime(dayUtc.Year, dayUtc.Month, dayUtc.Day, 18, 0, 0, DateTimeKind.Utc);

        for (var current = workDayStart; current.AddMinutes(service.DurationMinutes) <= workDayEnd; current = current.AddMinutes(30))
        {
            var slotEnd = current.AddMinutes(service.DurationMinutes);

            var overlaps = bookings.Any(b =>
                current < b.EndTimeUtc &&
                slotEnd > b.StartTimeUtc);

            if (!overlaps && current > DateTime.UtcNow)
            {
                slots.Add(current);
            }
        }

        return slots;
    }
}
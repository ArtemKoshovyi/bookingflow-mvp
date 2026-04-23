using BookingApp.Data;
using BookingApp.Dtos;
using BookingApp.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookingApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly BookingService _bookingService;
    private readonly AppDbContext _context;

    public BookingsController(BookingService bookingService, AppDbContext context)
    {
        _bookingService = bookingService;
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var result = await _bookingService.CreateBookingAsync(request);

        if (!result.Success)
        {
            return BadRequest(new { message = result.Error });
        }

        return Ok(new
        {
            message = "Booking created successfully.",
            bookingId = result.Booking!.Id
        });
    }

    [HttpGet("available-slots")]
    public async Task<IActionResult> GetAvailableSlots(
        [FromQuery] int workerId,
        [FromQuery] int serviceId,
        [FromQuery] DateTime dayUtc)
    {
        var slots = await _bookingService.GetAvailableSlotsAsync(workerId, serviceId, dayUtc);
        return Ok(slots);
    }

    
        [HttpGet]
        public async Task<IActionResult> GetBookings()
        {
            var businessIdHeader = Request.Headers["X-Business-Id"].FirstOrDefault();

            if (string.IsNullOrEmpty(businessIdHeader))
                return BadRequest("Missing BusinessId");

            var businessId = int.Parse(businessIdHeader);

            var bookings = await _context.Bookings
                .Include(b => b.Worker)
                .Include(b => b.Service)
                .Where(b => b.BusinessId == businessId)
                .OrderBy(b => b.StartTimeUtc)
                .Select(b => new
                {
                    b.Id,
                    b.ClientName,
                    b.ClientEmail,
                    b.ClientPhone,
                    WorkerName = b.Worker!.Name,
                    ServiceName = b.Service!.Name,
                    StartTimeUtc = DateTime.SpecifyKind(b.StartTimeUtc, DateTimeKind.Utc),
                    EndTimeUtc = DateTime.SpecifyKind(b.EndTimeUtc, DateTimeKind.Utc)
                })
                .ToListAsync();

            return Ok(bookings);
        }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBooking(int id)
    {
        var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.Id == id);

        if (booking is null)
        {
            return NotFound(new { message = "Booking not found." });
        }

        _context.Bookings.Remove(booking);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Booking deleted successfully." });
    }
}
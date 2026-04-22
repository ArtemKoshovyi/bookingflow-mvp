using BookingApp.Data;
using BookingApp.Dtos;
using BookingApp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookingApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ServicesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetServices()
    {
        var services = await _context.Services
            .Include(s => s.Worker)
            .Select(s => new
            {
                s.Id,
                s.Name,
                s.DurationMinutes,
                s.Price,
                s.WorkerId,
                WorkerName = s.Worker != null ? s.Worker.Name : ""
            })
            .ToListAsync();

        return Ok(services);
    }

    [HttpPost]
    public async Task<IActionResult> CreateService([FromBody] CreateServiceRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var workerExists = await _context.Workers.AnyAsync(w => w.Id == request.WorkerId);
        if (!workerExists)
        {
            return BadRequest(new { message = "Selected worker does not exist." });
        }

        var service = new Service
        {
            Name = request.Name,
            DurationMinutes = request.DurationMinutes,
            Price = request.Price,
            WorkerId = request.WorkerId
        };

        _context.Services.Add(service);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Service created successfully.",
            service.Id
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteService(int id)
    {
        var service = await _context.Services.FirstOrDefaultAsync(s => s.Id == id);

        if (service is null)
        {
            return NotFound(new { message = "Service not found." });
        }

        var hasBookings = await _context.Bookings.AnyAsync(b => b.ServiceId == id);
        if (hasBookings)
        {
            return BadRequest(new { message = "Cannot delete service with existing bookings." });
        }

        _context.Services.Remove(service);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Service deleted successfully." });
    }
}
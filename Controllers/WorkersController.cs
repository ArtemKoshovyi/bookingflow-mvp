using BookingApp.Data;
using BookingApp.Dtos;
using BookingApp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookingApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkersController : ControllerBase
{
    private readonly AppDbContext _context;

    public WorkersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
public async Task<IActionResult> GetWorkers()
{
    var businessIdHeader = Request.Headers["X-Business-Id"].FirstOrDefault();

    if (string.IsNullOrEmpty(businessIdHeader))
        return BadRequest("Missing BusinessId");

    var businessId = int.Parse(businessIdHeader);

    var workers = await _context.Workers
        .Where(w => w.BusinessId == businessId)
        .Select(w => new
        {
            w.Id,
            w.Name
        })
        .ToListAsync();

    return Ok(workers);
}

    [HttpPost]
    public async Task<IActionResult> CreateWorker([FromBody] CreateWorkerRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var worker = new Worker
        {
            Name = request.Name
        };

        _context.Workers.Add(worker);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Worker created successfully.",
            worker.Id,
            worker.Name
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWorker(int id)
    {
        var worker = await _context.Workers
            .Include(w => w.Services)
            .Include(w => w.Bookings)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (worker is null)
        {
            return NotFound(new { message = "Worker not found." });
        }

        if (worker.Bookings.Any())
        {
            return BadRequest(new { message = "Cannot delete worker with existing bookings." });
        }

        _context.Workers.Remove(worker);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Worker deleted successfully." });
    }

    [HttpGet("{workerId}/services")]
    public async Task<IActionResult> GetWorkerServices(int workerId)
    {
        var services = await _context.Services
            .Where(s => s.WorkerId == workerId)
            .Select(s => new
            {
                s.Id,
                s.Name,
                s.DurationMinutes,
                s.Price,
                s.WorkerId
            })
            .ToListAsync();

        return Ok(services);
    }
}
using BookingApp.Data;
using BookingApp.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace BookingApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;

    public AuthController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var business = _context.Businesses
            .FirstOrDefault(b => b.Username == request.Username);

        if (business == null || business.Password != request.Password)
        {
            return Unauthorized(new { message = "Invalid username or password." });
        }

        return Ok(new
        {
            message = "Login successful.",
            businessId = business.Id,
            businessName = business.Name,
            slug = business.Slug
        });
    }
}
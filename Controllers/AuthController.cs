using BookingApp.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace BookingApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private const string AdminUsername = "admin";
    private const string AdminPassword = "1234";

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        var business = _context.Businesses
            .FirstOrDefault(b => b.Username == request.Username);

        if (business == null || business.Password != request.Password)
        {
            return Unauthorized(new { message = "Invalid credentials" });
        }

        return Ok(new
        {
            businessId = business.Id,
            businessName = business.Name,
            slug = business.Slug
        });
    }

    [HttpGet("check")]
    public IActionResult Check()
    {
        return Ok(new { message = "API auth endpoint is working." });
    }
}
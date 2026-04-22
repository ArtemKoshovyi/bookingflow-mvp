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
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        if (request.Username != AdminUsername || request.Password != AdminPassword)
        {
            return Unauthorized(new { message = "Invalid username or password." });
        }

        return Ok(new
        {
            message = "Login successful.",
            username = AdminUsername
        });
    }

    [HttpGet("check")]
    public IActionResult Check()
    {
        return Ok(new { message = "API auth endpoint is working." });
    }
}
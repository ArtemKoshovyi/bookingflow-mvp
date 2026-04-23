using BookingApp.Data;
using Microsoft.AspNetCore.Mvc;

namespace BookingApp.Controllers;

[ApiController]
[Route("api/public")]
public class PublicController : ControllerBase
{
    private readonly AppDbContext _context;

    public PublicController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("business/{slug}")]
    public IActionResult GetBusiness(string slug)
    {
        var business = _context.Businesses.FirstOrDefault(b => b.Slug == slug);

        if (business == null)
        {
            return NotFound(new { message = "Business not found." });
        }

        return Ok(new
        {
            id = business.Id,
            name = business.Name,
            slug = business.Slug
        });
    }
}
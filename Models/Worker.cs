using System.ComponentModel.DataAnnotations;

namespace BookingApp.Models;

public class Worker
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public List<Service> Services { get; set; } = new();
    public List<Booking> Bookings { get; set; } = new();

    public int BusinessId { get; set; }
    public Business? Business { get; set; }
}
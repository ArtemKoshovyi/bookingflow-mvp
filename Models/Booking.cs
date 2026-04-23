using System.ComponentModel.DataAnnotations;

namespace BookingApp.Models;

public class Booking
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string ClientName { get; set; } = string.Empty;

    public string ClientEmail { get; set; } = string.Empty;

    [Required]
    public string ClientPhone { get; set; } = string.Empty;

    public int WorkerId { get; set; }
    public Worker? Worker { get; set; }

    public int ServiceId { get; set; }
    public Service? Service { get; set; }

    public DateTime StartTimeUtc { get; set; }
    public DateTime EndTimeUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public int BusinessId { get; set; }
    public Business? Business { get; set; }
}
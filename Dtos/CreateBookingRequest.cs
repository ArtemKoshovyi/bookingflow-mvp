using System.ComponentModel.DataAnnotations;

namespace BookingApp.Dtos;

public class CreateBookingRequest
{
    [Required]
    [MaxLength(100)]
    public string ClientName { get; set; } = string.Empty;

    public string ClientEmail { get; set; } = string.Empty;

    [Required]
    public string ClientPhone { get; set; } = string.Empty;

    [Required]
    public int WorkerId { get; set; }

    [Required]
    public int ServiceId { get; set; }

    [Required]
    public DateTime StartTimeUtc { get; set; }
}
using System.ComponentModel.DataAnnotations;

namespace BookingApp.Dtos;

public class CreateServiceRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Range(1, 1440)]
    public int DurationMinutes { get; set; }

    [Range(0, 100000)]
    public decimal Price { get; set; }

    [Required]
    public int WorkerId { get; set; }
}
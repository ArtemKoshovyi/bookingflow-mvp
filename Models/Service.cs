using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BookingApp.Models;

public class Service
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Range(1, 1440)]
    public int DurationMinutes { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    public int WorkerId { get; set; }
    public Worker? Worker { get; set; }

    public int BusinessId { get; set; }
    public Business? Business { get; set; }
}
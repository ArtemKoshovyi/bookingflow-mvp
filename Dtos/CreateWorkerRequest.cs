using System.ComponentModel.DataAnnotations;

namespace BookingApp.Dtos;

public class CreateWorkerRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
}
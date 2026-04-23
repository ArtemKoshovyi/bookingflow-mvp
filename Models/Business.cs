public class Business
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;

    public string Username { get; set; } = null!;
    public string Password { get; set; } = null!; // пока просто, потом захешируем

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
using BookingApp.Models;
using Microsoft.EntityFrameworkCore;

namespace BookingApp.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Worker> Workers => Set<Worker>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Business> Businesses => Set<Business>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Worker>()
            .HasMany(w => w.Services)
            .WithOne(s => s.Worker)
            .HasForeignKey(s => s.WorkerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Worker>()
            .HasMany(w => w.Bookings)
            .WithOne(b => b.Worker)
            .HasForeignKey(b => b.WorkerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Service)
            .WithMany()
            .HasForeignKey(b => b.ServiceId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
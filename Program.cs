using BookingApp.Data;
using BookingApp.Models;
using BookingApp.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<BookingService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();
app.UseDefaultFiles();
app.UseStaticFiles();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.Migrate();

    if (!context.Businesses.Any(b => b.Username == "fryzjer"))
    {
        context.Businesses.Add(new Business
        {
            Name = "Test Barber",
            Slug = "fryzjer",
            Username = "fryzjer",
            Password = "1234"
        });

        context.SaveChanges();
    }

    if (!context.Businesses.Any(b => b.Username == "Malwa"))
    {
        context.Businesses.Add(new Business
        {
            Name = "Studio lokal",
            Slug = "Malwa",
            Username = "Malwa",
            Password = "1234"
        });

        context.SaveChanges();
    }

    if (!context.Businesses.Any(b => b.Username == "uroda"))
    {
        context.Businesses.Add(new Business
        {
            Name = "Studio uroda",
            Slug = "uroda",
            Username = "uroda",
            Password = "1234"
        });

        context.SaveChanges();
    }
    if (!context.Businesses.Any(b => b.Username == "kwiatek"))
    {
        context.Businesses.Add(new Business
        {
            Name = "Studio kwiatek",
            Slug = "kwiatek",
            Username = "kwiatek",
            Password = "1234"
        });

        context.SaveChanges();
    }
}

app.Run();